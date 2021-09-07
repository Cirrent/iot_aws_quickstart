import { Router } from 'express';

import postInteropController from '../controllers/postInterop';

const router = Router();

router.post('/', postInteropController);

export default router;
