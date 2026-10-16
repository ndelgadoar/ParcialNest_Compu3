import { ConflictException, HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Program } from './entities/program.entity';
import { CreateProgramDto } from './dto/create-program.dto';
import { BulkCreateProgramDto } from './dto/bulk-create-program.dto';
import { AssignStudentsDto } from './dto/assign-students.dto';
import { PaginationDto } from '../student/dto/pagination.dto';
import { Student } from '../student/entities/student.entity';
import { User } from '../user/entities/user.entity';

@Injectable()
export class ProgramService {

    private readonly logger = new Logger("ProgramService");

    // TODO Reto 1: inyecta el repositorio de Program (y lo que necesites para las transacciones)
    constructor(
        @InjectRepository(Program)
        private readonly programRepository: Repository<Program>,
        private readonly datasource: DataSource
    ){}

    // TODO Reto 1: create(createProgramDto, user) -> guarda el programa
    //   - nombre o código repetido -> 409 Conflict (no 500)
    async create(createProgramDto: CreateProgramDto, user: User){
        try{
            const program = this.programRepository.create({
                ...createProgramDto,
                createdBy: user
            });
            await this.programRepository.save(program);
            return program;
        }catch(error){
            this.handleException(error);
        }
    }

    // TODO Reto 1: findAll(paginationDto) -> lista paginada (limit / skip)
    async findAll(paginationDto: PaginationDto){
        const { limit, skip } = paginationDto;
        try{
            return await this.programRepository.find({
                take: limit,
                skip: skip
            });
        }catch(error){
            this.handleException(error);
        }
    }

    // TODO Reto 2: findOne(id) -> programa con sus estudiantes, 404 si no existe
    async findOne(id: string){
        const program = await this.programRepository.findOne({
            where: { id },
            relations: { students: true }
        });

        if(!program) throw new NotFoundException(`Program with id ${id} not found`);

        return program;
    }

    // TODO Reto 2: assignStudents(id, assignStudentsDto) -> AGREGA estudiantes al programa
    //   dentro de una transacción (QueryRunner), conservando los que ya tenía.
    //   Mismo patrón del update de estudiantes corregido en clase (combinar las notas):
    //   traer los actuales -> combinar con los nuevos -> guardar la lista completa.
    //   Si algún id no existe: 404 y rollback.
    async assignStudents(id: string, assignStudentsDto: AssignStudentsDto){
        const studentIds = [...new Set(assignStudentsDto.studentIds)];

        const queryRunner = this.datasource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try{
            const program = await queryRunner.manager.findOne(Program, {
                where: { id },
                relations: { students: true }
            });
            if(!program) throw new NotFoundException(`Program with id ${id} not found`);

            const students = await queryRunner.manager.findBy(Student, { id: In(studentIds) });
            if(students.length !== studentIds.length){
                const foundIds = students.map(student => student.id);
                const missingIds = studentIds.filter(studentId => !foundIds.includes(studentId));
                throw new NotFoundException(`Students not found: ${missingIds.join(", ")}`);
            }

            const currentStudents = program.students ?? [];
            const currentIds = currentStudents.map(student => student.id);
            const newStudents = students.filter(student => !currentIds.includes(student.id));
            program.students = [...currentStudents, ...newStudents];

            await queryRunner.manager.save(program);
            await queryRunner.commitTransaction();
        }catch(error){
            await queryRunner.rollbackTransaction();
            this.handleException(error);
        }finally{
            await queryRunner.release();
        }

        return this.findOne(id);
    }

    // TODO Reto 3: bulkCreate(bulkCreateProgramDto, user) -> crea todos los programas o ninguno
    //   (transacción). Cualquier nombre/código repetido -> 409 y rollback.
    async bulkCreate(bulkCreateProgramDto: BulkCreateProgramDto, user: User){
        const { programs } = bulkCreateProgramDto;

        const names = programs.map(program => program.name);
        const codes = programs.map(program => program.code);
        if(new Set(names).size !== names.length || new Set(codes).size !== codes.length)
            throw new ConflictException('Repeated name or code inside the request');

        const queryRunner = this.datasource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try{
            const newPrograms = programs.map(program => this.programRepository.create({
                ...program,
                createdBy: user
            }));
            await queryRunner.manager.save(newPrograms);
            await queryRunner.commitTransaction();
            return newPrograms;
        }catch(error){
            await queryRunner.rollbackTransaction();
            this.handleException(error);
        }finally{
            await queryRunner.release();
        }
    }

    private handleException(error: any): never{
        if(error instanceof HttpException) throw error;

        if(error.code === '23505')
            throw new ConflictException(error.detail);

        this.logger.error(error);
        throw new InternalServerErrorException('Unexpected error, check server logs');
    }
}
