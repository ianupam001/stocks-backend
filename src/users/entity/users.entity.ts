import { Entity, ObjectIdColumn, ObjectId, Column, Index } from 'typeorm';
import { Role } from '../enums/role.enum';

@Entity('user')
@Index('IDX_USER_PHONE', ['phone'], { unique: true })
export class User {
  @ObjectIdColumn()
  id: ObjectId;

  @Column()
  username: string;

  @Column()
  password: string;

  @Column()
  email: string;

  @Column()
  phone: string;

  @Column({
    type: 'array',
    default: [Role.USER],
  })
  roles: Role[];

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;
}
