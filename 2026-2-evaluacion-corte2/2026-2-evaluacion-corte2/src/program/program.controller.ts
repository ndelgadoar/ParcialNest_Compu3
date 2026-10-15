import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiConflictResponse, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProgramService } from './program.service';
import { CreateProgramDto } from './dto/create-program.dto';
import { BulkCreateProgramDto } from './dto/bulk-create-program.dto';
import { PaginationDto } from '../student/dto/pagination.dto';
import { Program } from './entities/program.entity';
import { Auth } from '../user/decorators/auth.decorator';
import { GetUser } from '../user/decorators/get-user.decorator';
import { ValidRoles } from '../user/enums/valid-roles.enum';
import { User } from '../user/entities/user.entity';

@ApiTags("Programs")
@Controller('program')
export class ProgramController {
  constructor(private readonly programService: ProgramService) {}

  // TODO Reto 1: POST   /api/program               -> crear programa
  // TODO Reto 1: GET    /api/program               -> listar (paginado con PaginationDto)
  // TODO Reto 2: GET    /api/program/:id           -> programa con sus estudiantes
  // TODO Reto 2: PATCH  /api/program/:id/students  -> agregar estudiantes (acumulativo)
  // TODO Reto 3: POST   /api/program/bulk          -> crear programas en lote (todo o nada)
  // TODO Reto 4: proteger los POST y el PATCH para que solo un admin pueda usarlos

  @Post()
  @Auth(ValidRoles.admin)
  @ApiOperation({ summary: "Create a program", description: "Requires the admin role" })
  @ApiCreatedResponse({ description: "Program was created", type: Program })
  @ApiBadRequestResponse({ description: "Invalid request body" })
  @ApiConflictResponse({ description: "Name or code already exists" })
  create(@Body() createProgramDto: CreateProgramDto, @GetUser() user: User){
    return this.programService.create(createProgramDto, user);
  }

  @Post("bulk")
  @Auth(ValidRoles.admin)
  @ApiOperation({ summary: "Create several programs", description: "All or none. Requires the admin role" })
  @ApiCreatedResponse({ description: "Programs were created", type: [Program] })
  @ApiBadRequestResponse({ description: "Invalid request body" })
  @ApiConflictResponse({ description: "A name or code already exists or is repeated in the request" })
  bulkCreate(@Body() bulkCreateProgramDto: BulkCreateProgramDto, @GetUser() user: User){
    return this.programService.bulkCreate(bulkCreateProgramDto, user);
  }

  @Get()
  @ApiOperation({ summary: "List programs", description: "Supports pagination with limit and skip" })
  @ApiOkResponse({ description: "Program's list", type: [Program] })
  @ApiBadRequestResponse({ description: "Invalid pagination params" })
  findAll(@Query() paginationDto: PaginationDto){
    return this.programService.findAll(paginationDto);
  }
}
