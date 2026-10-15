import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { User } from "../../user/entities/user.entity";

// TODO Reto 1: convierte esta clase en una entidad de TypeORM (tabla "program") con:
//   - id: UUID generado automáticamente
//   - name: text, único
//   - code: text, único
//   - credits: int
// TODO Reto 2: relación 1:N con Student -> propiedad `students?: Student[]`
// TODO Reto 4: relación N:1 con User -> propiedad `createdBy?: User` (el admin que lo creó)
//
// Usa imports relativos (ej. "../../student/entities/student.entity"), no "src/...":
// Jest no resuelve el alias "src/" y el test de Student dejaría de correr.
@Entity()
export class Program {

    @ApiProperty({ example: "b3f1c9a0-7d3e-4a39-9a43-0f1e6c0a1f55", format: "uuid" })
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ApiProperty({ example: "Ingenieria de Sistemas" })
    @Column({
        type: "text",
        unique: true
    })
    name: string;

    @ApiProperty({ example: "SIS" })
    @Column({
        type: "text",
        unique: true
    })
    code: string;

    @ApiProperty({ example: 160 })
    @Column("int")
    credits: number;

    @ManyToOne(
        () => User,
        { nullable: true }
    )
    createdBy?: User;
}
