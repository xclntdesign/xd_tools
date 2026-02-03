import WebAuditEmailTemplate from '@/features/web-audits/components/email-template';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    if(!body.url || !body.auditId || !body.emails) {
        return NextResponse.json({ error: "Invalid request." }, { status: 401 } );
    }

    const auditUrl = "https://tools.xclntdesign.com/web-audit/" + body.auditId;
    
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_EMAIL_ADDRESS!,
      to: body.emails,
      subject: 'Web Site Audit Report for ' + body.url,
      react: WebAuditEmailTemplate({ url: auditUrl }),
    });

    if (error) {
        console.error(error);
      return Response.json({ error }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    console.error(error);
    return Response.json({ error }, { status: 500 });
  }
}