import { IsIn } from 'class-validator';
import { APP_USER_ROLES, type AppUserRole } from '../../common/app-user-role';

export class UpdateUserAppRoleDto {
  @IsIn([...APP_USER_ROLES], { message: 'Роль: USER, ORGANIZER или ADMIN' })
  appRole!: AppUserRole;
}
