import { IsString, IsEmail, MinLength, MaxLength } from 'class-validator';

export class CreateUserDto {
    @IsString()
    @MinLength(2)
    @MaxLength(67)
    nome!: string

    @IsString()
    @MinLength(2)
    @MaxLength(67)
    sobrenome!: string

    @IsEmail()
    email!: string

    @IsString()
    @MinLength(8)
    @MaxLength(67)
    senha!: string
}
