import { generateAuthMetadata } from '@/components/layout/AuthLayout';
import { Metadata } from 'next';
import ForgotPasswordPage from './ForgotPasswordPage';

export const metadata: Metadata = generateAuthMetadata('Login');

export default ForgotPasswordPage;