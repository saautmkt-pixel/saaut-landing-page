import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const resendKey = process.env.RESEND_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);
const resend = new Resend(resendKey);

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { name, email, phone, company_size } = req.body;

        if (!name || !email || !phone || !company_size) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
        }

        // 1. Salvar no Supabase (Note: Assumes table 'leads' exists or needs to be created)
        const { error: supaError } = await supabase
            .from('leads')
            .insert([{ name, email, phone, company_size }]);

        if (supaError) {
            console.error('Supabase Error:', supaError);
            // If the table doesn't exist, we might want to log it but continue with the email if prioritized
        }

        // 2. Enviar E-mail de Notificação
        await resend.emails.send({
            from: 'SAAUT Leads <contato@saaut.com.br>',
            to: ['contato@saaut.com.br'], 
            subject: 'Novo Lead: Consultoria de Vendas SAAUT',
            html: `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #00bcd4;">Novo Lead Identificado!</h2>
          <p>Um novo potencial cliente demonstrou interesse na Consultoria de Vendas.</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Nome:</strong> ${name}</p>
            <p style="margin: 5px 0;"><strong>E-mail:</strong> ${email}</p>
            <p style="margin: 5px 0;"><strong>Telefone:</strong> ${phone}</p>
            <p style="margin: 5px 0;"><strong>Tamanho da Empresa:</strong> ${company_size}</p>
          </div>
          
          <p>Entre em contato o mais rápido possível para garantir a conversão.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #888;">Lead Capture System - SAAUT</p>
        </div>
      `,
        });

        // 3. E-mail de Confirmação para o Lead
        await resend.emails.send({
            from: 'SAAUT <contato@saaut.com.br>',
            to: [email],
            subject: 'Recebemos seu contato - SAAUT Consultoria',
            html: `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #00bcd4;">Olá, ${name}!</h2>
          <p>Obrigado por seu interesse na Consultoria de Vendas da SAAUT.</p>
          <p>Nossa equipe de especialistas já recebeu suas informações e entrará em contato em breve para agendar um diagnóstico da sua operação comercial.</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Fique atento ao seu telefone e e-mail.</strong></p>
          </div>
          
          <p>Até breve!</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #888;">SAAUT - Inteligência em Vendas</p>
        </div>
      `,
        });

        return res.status(200).json({ message: 'Lead registrado com sucesso!' });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Erro interno do servidor' });
    }
}
