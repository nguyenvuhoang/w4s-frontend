import { i18n, Locale } from '@/configs/i18n';
import HTMLComponent from '@/views/components/html-component';
import fs from 'fs';

export async function generateStaticParams() {
    const htmlSlugs = ['termservice']
    const params = i18n.locales.flatMap(locale =>
        htmlSlugs.map(slug => ({
            locale,
            slug
        }))
    )

    return params
}
const HtmlPage = async (props: { params: Promise<{ locale: Locale, slug: string }> }) => {

    const { locale, slug } = await props.params

    const filename = fs.readFileSync(`./public/assets/html/${locale}/${slug}.html`, 'utf-8');

    return (
        <HTMLComponent filename={filename} />
    )
}

export default HtmlPage