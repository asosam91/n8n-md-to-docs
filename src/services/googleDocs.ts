import { google } from 'googleapis';
import type { GoogleDocResponse } from '../types';
import { convertMarkdownToDocx } from './docxConverter';
import { Readable } from 'stream';

export async function convertMarkdownToGoogleDoc(
  markdownContent: string,
  accessToken: string,
  fileName: string = 'Converted from Markdown',
  folderId?: string
): Promise<GoogleDocResponse> {
  try {
  console.log('Starting markdown to Google Doc conversion', {
    markdownLength: markdownContent.length,
    fileName,
    folderId,
    sampleMarkdown: markdownContent.substring(0, 100) // Log sample of markdown for debugging
  });
    
    // Strip markdown code block wrapper if present
    if (markdownContent.startsWith('```markdown\n') && markdownContent.endsWith('```')) {
      console.log('Removing markdown code block wrapper');
      markdownContent = markdownContent.substring('```markdown\n'.length, markdownContent.length - 3);
    } else if (markdownContent.startsWith('```\n') && markdownContent.endsWith('```')) {
      console.log('Removing generic code block wrapper');
      markdownContent = markdownContent.substring('```\n'.length, markdownContent.length - 3);
    }
    
    const auth = new google.auth.OAuth2();
    auth.setCredentials({
      access_token: accessToken,
      token_type: 'Bearer'
    });

    // First convert markdown to docx using our converter
    console.log('Converting markdown to DOCX buffer');
    const docxBuffer = await convertMarkdownToDocx(markdownContent);
    console.log('DOCX conversion complete', { docxSize: docxBuffer.length });
    
    if (!docxBuffer || docxBuffer.length === 0) {
      throw new Error('DOCX conversion failed - empty buffer returned');
    }

    // Initialize Google Drive API
    const drive = google.drive({ 
      version: 'v3', 
      auth 
    });

    console.log('Uploading document to Google Drive', {
      fileName,
      folderId,
      tokenPrefix: accessToken.substring(0, 10) + '...',
      bufferSize: docxBuffer.length
    });
    
    // Create a readable stream from the buffer
    const stream = Readable.from(docxBuffer);

    // Upload the docx file to Google Drive
    const fileMetadata: any = {
      name: fileName,
      mimeType: 'application/vnd.google-apps.document' // This converts to Google Docs format
    };

    if (folderId) {
      fileMetadata.parents = [folderId];
    }

    const media = {
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      body: stream
    };

    try {
      const response = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id'
      });

      const documentId = response.data.id;
      if (!documentId) {
        throw new Error('Failed to create document: No document ID returned');
      }

      const documentUrl = `https://docs.google.com/document/d/${documentId}`;
      console.log('Document created successfully', { 
        documentId, 
        documentUrl, 
        fileName 
      });

      // Optionally get the document content to verify it's not empty
      try {
        const docResult = await drive.files.get({
          fileId: documentId,
          fields: 'id,name,mimeType,size'
        });
        
        console.log('Document verification', {
          name: docResult.data.name,
          mimeType: docResult.data.mimeType,
          size: docResult.data.size
        });
      } catch (docError) {
        console.warn('Could not verify document content (not critical)', { 
          error: docError instanceof Error ? docError.message : 'Unknown error' 
        });
      }

      return {
        documentId,
        url: documentUrl,
        status: 200,
        fileName
      };
    } catch (driveError: any) {
      console.error('Error in Google Drive API:', {
        message: driveError.message,
        status: driveError.status || driveError.code,
        details: driveError.errors || driveError.stack
      });
      throw driveError;
    }
  } catch (error: any) {
    console.error('Error in document creation process:', {
      message: error.message,
      status: error.status || error.code || 500,
      details: error.errors || error.stack
    });
    throw error;
  }
} 