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
        const { name, email, phone, linkedin, company_size } = req.body;

        if (!name || !email || !phone || !company_size) {
            return res.status(400).json({ error: 'Os campos Nome, E-mail, Telefone e Tamanho do Time são obrigatórios.' });
        }

        // 1. Salvar no Supabase
        const { error: supaError } = await supabase
            .from('leads_consultoria')
            .insert([{ name, email, phone, linkedin, company_size }]);

        if (supaError) {
            console.error('Supabase Error:', supaError);
            return res.status(500).json({ error: `Erro no Supabase: ${supaError.message}` });
        }

        // 2. Enviar E-mail de Notificação
        try {
            await resend.emails.send({
                from: 'SAAUT Leads <leads@saaut.com.br>',
                to: ['thais.andrade@ndi3.com.br', 'fabio.trindade@saaut.com.br'],
                subject: 'Novo Lead: Consultoria de Vendas SAAUT',
                html: `
                <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                  <h2 style="color: #4DB1E8;">Novo Lead Identificado!</h2>
                  <p>Um novo potencial cliente demonstrou interesse na Consultoria de Vendas.</p>
                  <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Nome:</strong> ${name}</p>
                    <p style="margin: 5px 0;"><strong>E-mail:</strong> ${email}</p>
                    <p style="margin: 5px 0;"><strong>Telefone:</strong> ${phone}</p>
                    <p style="margin: 5px 0;"><strong>LinkedIn:</strong> ${linkedin || 'Não informado'}</p>
                    <p style="margin: 5px 0;"><strong>Tamanho do Time:</strong> ${company_size}</p>
                  </div>
                  <p>Entre em contato o mais rápido possível para garantir a conversão.</p>
                  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                  <p style="font-size: 12px; color: #888;">Lead Capture System - SAAUT</p>
                </div>
                `,
            });
        } catch (mailError: any) {
            console.error('Resend Error:', mailError);
            // Lead salvo no Supabase, mas e-mail falhou — retorna sucesso mesmo assim
            return res.status(200).json({
                message: 'Lead registrado com sucesso!',
                warning: 'Notificação por e-mail falhou.'
            });
        }

        return res.status(200).json({ message: 'Lead registrado com sucesso!' });

    } catch (error: any) {
        console.error('Global API Error:', error);
        return res.status(500).json({ error: `Erro na execução: ${error.message}` });
    }
}

