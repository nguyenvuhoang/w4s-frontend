import { generateAuthMetadata } from '@components/layout/AuthLayout';
import { i18n } from '@/configs/i18n';
import { Metadata } from 'next';
import LoginPage from './LoginPage';

export const metadata: Metadata = generateAuthMetadata('Login');

export async function generateStaticParams() {
    return i18n.locales.map((l) => ({ locale: l }));
}

export default LoginPage;