import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';
import {
  validateChangePassword,
  validateLogin,
  validateRegister,
} from '../validators/authValidators.js';

const router = Router();

router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/password', authMiddleware, validateChangePassword, authController.changePassword);

export default router;
