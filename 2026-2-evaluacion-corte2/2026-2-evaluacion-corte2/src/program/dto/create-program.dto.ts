import { IsInt, IsPositive, IsString, Matches, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

// TODO Reto 1: reglas de validación con class-validator
//   - name: string, mínimo 3 caracteres
//   - code: string de 3 a 6 letras MAYÚSCULAS (ej. "SIS", "MED")
//   - credits: entero positivo
export class CreateProgramDto {

    @ApiProperty({ example: "Ingenieria de Sistemas", description: "Program name (must be unique)", minLength: 3 })
    @IsString()
    @MinLength(3)
    name: string;

    @ApiProperty({ example: "SIS", description: "Program code, 3 to 6 uppercase letters (must be unique)" })
    @IsString()
    @Matches(/^[A-Z]{3,6}$/, { message: "code must be 3 to 6 uppercase letters" })
    code: string;

    @ApiProperty({ example: 160, description: "Total credits of the program" })
    @IsInt()
    @IsPositive()
    credits: number;
}
