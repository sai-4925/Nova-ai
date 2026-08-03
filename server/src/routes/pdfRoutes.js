// routes/pdfRoutes.js
import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { uploadPdfMiddleware } from '../middleware/uploadMiddleware.js';
import { uploadPdf, listPdfs, deletePdf } from '../controllers/pdfController.js';

const router = Router();

router.use(protect);

router.post('/upload', uploadPdfMiddleware, uploadPdf);
router.get('/', listPdfs);
router.delete('/:id', deletePdf);

export default router;
