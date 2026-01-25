import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
const pdf = require('pdf-parse/lib/pdf-parse.js');

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        let text = '';

        if (file.type === 'application/pdf') {
            try {
                const data = await pdf(buffer);
                text = data.text;
            } catch (pdfError) {
                console.error("PDF Parse specific error:", pdfError);
                throw new Error("Could not parse this PDF file. It might be corrupted or password protected.");
            }
        } else if (
            file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            file.name.endsWith('.docx')
        ) {
            const result = await mammoth.extractRawText({ buffer });
            text = result.value;
        } else {
            // For plain text or other formats, try simple decode
            text = new TextDecoder().decode(buffer);
        }

        // Clean up text
        // - Replace multiple newlines with HTML breaks for the editor
        // - Maybe standardizing spacing? 
        // User asked to "extract every single word arrange as it was with the titles, headers, paragraphs spaces"
        // The raw text usually keeps paragraphs as newlines.
        // We will convert newlines to <br> or <p> tags for the contentEditable editor.

        // Simple strategy: preserve newlines
        // contentEditable usually works best with <div> or <p> for lines, or just <br>.
        // Let's replace \n with <br/> for now, or wrap in divs? 
        // HTML editors are finicky. Let's try replacing \n with <br> + \n

        const cleanText = text
            .replace(/\r\n/g, '\n')
            .replace(/\n\n+/g, '\n<br><br>\n') // Double newline = paragraph break
            .replace(/\n/g, '\n<br>\n'); // Single newline = line break

        return NextResponse.json({ content: cleanText });
    } catch (error) {
        console.error('Error parsing file:', error);
        return NextResponse.json({ error: 'Failed to parse file' }, { status: 500 });
    }
}
