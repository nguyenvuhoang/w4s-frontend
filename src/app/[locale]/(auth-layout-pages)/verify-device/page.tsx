import { generateAuthMetadata } from '@components/layout/AuthLayout';
import { Metadata } from 'next';
import VerifyDevicePage from './VerifyDevicePage';

export const metadata: Metadata = generateAuthMetadata('Login');

export default VerifyDevicePage;