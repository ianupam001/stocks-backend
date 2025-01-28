import { Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller({
    path:'auth',
    version:'1'
})
export class AuthController {
    @Post()
    login(){
        return `User logged in sucessfully`
    }
}
