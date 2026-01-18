import { generateAuthMetadata } from '@/components/layout/AuthLayout';
import { Metadata } from 'next';
import ChangePasswordPage from './ChangePasswordPage';

export const metadata: Metadata = generateAuthMetadata('Login');

export default ChangePasswordPage;