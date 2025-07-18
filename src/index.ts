import express, { Request, Response } from 'express';
import cors from 'cors';
import type { MarkdownRequest, GoogleDocResponse, ErrorResponse } from './types';
import { convertMarkdownToGoogleDoc } from './services/googleDocs';
import { convertMarkdownToDocx } from './services/docxConverter';

const app = express();
app.use(express.json());
app.use(cors());

app.post('/', async (req: Request, res: Response) => {
  try {
    const requests: MarkdownRequest[] = Array.isArray(req.body) ? req.body : [req.body];
    const results = await Promise.all(
      requests.map(async (request) => {
        const markdownContent = request.output;
        const authHeader = req.headers.authorization;
        const fileName = request.fileName || 'Converted from Markdown';
        const folderId = request.folderId;

        if (!markdownContent) {
          return {
            error: 'Missing required field: output',
            status: 400,
            request: { ...request, output: undefined },
          } as ErrorResponse;
        }

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return {
            error: 'Missing or invalid authorization header',
            status: 401,
          } as ErrorResponse;
        }

        const accessToken = authHeader.split(' ')[1];

        try {
          const result = await convertMarkdownToGoogleDoc(markdownContent, accessToken, fileName, folderId);
          return {
            ...result,
            webhookUrl: request.webhookUrl,
            executionMode: request.executionMode,
          } as GoogleDocResponse;
        } catch (error: any) {
          return {
            error: 'Failed to convert markdown to Google Doc',
            details: error.message,
            status: error.status || 500,
          } as ErrorResponse;
        }
      })
    );

    if (results.length === 1) {
      const result = results[0];
      return res.status((result as GoogleDocResponse).status).json(result);
    }

    return res.json(results);
  } catch (error: any) {
    return res.status(500).json({
      error: 'Failed to process requests',
      details: error.message,
    } as ErrorResponse);
  }
});

// Optional test endpoint to debug DOCX generation
app.post('/test', async (req: Request, res: Response) => {
  try {
    const { markdown, fileName } = req.body;
    if (!markdown) {
      return res.status(400).json({ error: 'Missing markdown content' });
    }

    const result = await convertMarkdownToDocx(markdown);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName || 'test.docx'}"`);
    return res.send(Buffer.from(result));
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Markdown to Docs service running on port ${port}`);
});
