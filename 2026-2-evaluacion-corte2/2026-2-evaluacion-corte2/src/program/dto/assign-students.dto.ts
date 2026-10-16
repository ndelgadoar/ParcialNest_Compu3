import { ArrayNotEmpty, IsArray, IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

// TODO Reto 2: reglas de validación con class-validator
//   - studentIds: arreglo NO vacío, cada elemento debe ser un UUID
export class AssignStudentsDto {

    @ApiProperty({
        type: [String],
        example: ["4fcfc5ab-7902-478f-b173-b8f1e751af12", "8a3b6c1e-2f4d-4e7a-9c0b-5d1e2f3a4b5c"],
        description: "Ids of the students to add to the program"
    })
    @IsArray()
    @ArrayNotEmpty()
    @IsUUID("all", { each: true })
    studentIds: string[];
}
