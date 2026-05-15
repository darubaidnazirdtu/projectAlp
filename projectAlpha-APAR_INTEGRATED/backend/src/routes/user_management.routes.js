import { Router } from 'express';
import {
  createManagedUser,
  getManagedUsers,
  updateManagedUser
} from '../controllers/user_management.controller.js';

const router = Router();

router.get('/', getManagedUsers);
router.post('/', createManagedUser);
router.patch('/:id', updateManagedUser);

export default router;