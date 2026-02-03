import { Body, Column, Container, Head, Heading, Hr, Html, Img, Link, pixelBasedPreset, Preview, Row, Section, Tailwind } from "@react-email/components";

type EmailProps = {
    url: string;
};

const tailwindConfig = {
    presets: [pixelBasedPreset]
};

export default function WebAuditEmailTemplate({
    url
}: EmailProps) {
    return (
        <Html>
            <Head>
                <title>Web Audit by xclntDesign</title>
            </Head>
            <Tailwind config={tailwindConfig}>
                <Body className="bg-white font-sans">
                    <Preview>Web Audit by xclntDesign</Preview>
                    <Container className="p-5 mx-auto bg-[#eee]">
                        <Section className="bg-white">
                            <Section className="bg-[#09090b] py-5">
                                <Img
                                    src="https://minlpfnjsbqkdvxrzwte.supabase.co/storage/v1/object/public/xclntdesign/media/xclntdesign-logo-white.png"
                                    alt="xclntDesign logo"
                                    width={250}
                                    height={51}
                                    className="mx-auto"
                                />
                            </Section>
                            <Section className="py-5 px-7">
                                <Heading className="text-[#09090b] text-[20px] font-bold mb-3">
                                    Web Audit by xclntDesign
                                </Heading>
                                <p>We've completed a quick basic audit of your website. This report isn't meant to cover every detail, but it does highlight a few areas that could be improved to help your site perform better in search results (SEO) and support any online advertising or marketing you may be running.</p>
                                <p>To view your report, simply click the link below, or copy and paste the URL into your browser:</p>
                                <p><a href={url} target="_blank">{url}</a></p>
                                <p>If you have any questions about the report, feel free to reach out — we'd be happy to help explain anything or walk you through the findings.</p>
                                <p>And if you feel your website could be doing more for your business and are interested in having a new site built, just let us know. We'd be glad to help!</p>
                                <p>Talk soon,<br /><strong>xclntDesign, LLC</strong></p>
                            </Section>
                        </Section>
                        <Section className="py-3">
                            <ul className="text-center list-none pb-2">
                                <li className="inline-block mx-2">
                                    <Link href="https://goo.gl/maps/h2iZDjxFGa92" target="_blank" className="block w-9 h-9 text-center rounded-full bg-[#ccc]">
                                        <Img
                                            src="https://minlpfnjsbqkdvxrzwte.supabase.co/storage/v1/object/public/xclntdesign/social/google.png"
                                            alt="Google"
                                            width={18}
                                            height={18}
                                            className="mx-auto pt-2.25"
                                        />
                                    </Link>
                                </li>
                                <li className="inline-block mx-2">
                                    <Link href="https://www.facebook.com/xclntDesign" target="_blank" className="block w-9 h-9 text-center rounded-full bg-[#ccc]">
                                        <Img
                                            src="https://minlpfnjsbqkdvxrzwte.supabase.co/storage/v1/object/public/xclntdesign/social/facebook-f.png"
                                            alt="Facebook"
                                            width={11}
                                            height={18}
                                            className="mx-auto pt-2.25"
                                        />
                                    </Link>
                                </li>
                                <li className="inline-block mx-2">
                                    <Link href="https://www.instagram.com/xclntdesign1/" target="_blank" className="block w-9 h-9 text-center rounded-full bg-[#ccc]">
                                        <Img
                                            src="https://minlpfnjsbqkdvxrzwte.supabase.co/storage/v1/object/public/xclntdesign/social/instagram.png"
                                            alt="Instagram"
                                            width={16}
                                            height={18}
                                            className="mx-auto pt-2.25"
                                        />
                                    </Link>
                                </li>
                                <li className="inline-block mx-2">
                                    <Link href="https://www.youtube.com/channel/UCxHNLTwK2e10y34J76qxk7w" target="_blank" className="block w-9 h-9 text-center rounded-full bg-[#ccc]">
                                        <Img
                                            src="https://minlpfnjsbqkdvxrzwte.supabase.co/storage/v1/object/public/xclntdesign/social/youtube.png"
                                            alt="YouTube"
                                            width={20}
                                            height={18}
                                            className="mx-auto pt-2.25"
                                        />
                                    </Link>
                                </li>
                                <li className="inline-block mx-2">
                                    <Link href="https://twitter.com/xclntdesign" target="_blank" className="block w-9 h-9 text-center rounded-full bg-[#ccc]">
                                        <Img
                                            src="https://minlpfnjsbqkdvxrzwte.supabase.co/storage/v1/object/public/xclntdesign/social/x-twitter.png"
                                            alt="Twitter"
                                            width={16}
                                            height={18}
                                            className="mx-auto pt-2.25"
                                        />
                                    </Link>
                                </li>
                            </ul>
                            <Hr className="my-4 border-t-[#d5d5d7]" />
                            <Row>
                                <Column>
                                    <div className="text-center text-sm">Website:<br />
                                    <Link href="https://www.xclntdesign.com" target="blank" className="text-[#09090b] underline font-bold">
                                        www.xclntdesign.com
                                    </Link>
                                    </div>
                                </Column>
                                <Column>
                                    <div className="text-center text-sm">Phone Number:<br /><strong>(352) 787-2379</strong></div>
                                </Column>
                            </Row>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    )
}