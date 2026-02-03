import { ItemCard, ItemCardContent, ItemCardSubtitle, ItemCardTitle } from "@/components/item-card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { capitalizeFirstLetter } from "../utils";
import { Meta, Tech, WPTheme, WebHostRecord } from "./web-audit";

export function SiteInfoSection ({ tech, meta, wpTheme, webHost }: { tech: Tech[] | null, meta: Meta | null, wpTheme: WPTheme[] | null, webHost: WebHostRecord[] | null }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 my-6">
            {tech && tech.length > 0 ? (
                <div className="flex flex-col gap-6">
                    {tech?.map((tech: Tech) => (
                        <ItemCard key={tech.id} className="mb-1">
                            <ItemCardTitle>{tech.categories.join(', ')}</ItemCardTitle>
                            <ItemCardSubtitle>{tech.name}</ItemCardSubtitle>
                            <ItemCardContent>
                                Version: {tech.version !== "" ? tech.version : "Unknown"}
                            </ItemCardContent>
                        </ItemCard>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    <ItemCard className="mb-1">
                        <ItemCardTitle>Technologies</ItemCardTitle>
                        <ItemCardSubtitle>Unable to determine the technologies behind this site.</ItemCardSubtitle>
                    </ItemCard>
                </div>
            )}
            {meta && meta.social ? (
                <div className="flex flex-col gap-6">
                    {meta.social.length > 0 && meta.social.map((social: { network: string; url: string; profile: string; }) => (
                        <ItemCard key={social.network} className="mb-1">
                            <ItemCardTitle>{capitalizeFirstLetter(social.network)}</ItemCardTitle>
                            <ItemCardSubtitle>Profile: {social.profile}</ItemCardSubtitle>
                            <ItemCardContent>
                                <Link href={social.url} target="_blank">{social.url}</Link>
                            </ItemCardContent>
                        </ItemCard>
                    ))}
                </div>
            ): (
                <div className="flex flex-col gap-6">
                    <ItemCard className="mb-1">
                        <ItemCardTitle>Social Media</ItemCardTitle>
                        <ItemCardSubtitle>No social media links found.</ItemCardSubtitle>
                    </ItemCard>
                </div>
            )}
            {wpTheme && wpTheme.length > 0 ? (
                <div className="flex flex-col gap-6">
                    {wpTheme.map((theme: WPTheme) => (
                        <ItemCard key={theme.theme_uri} className="mb-1">
                            <ItemCardTitle>{theme.theme_name}</ItemCardTitle>
                            <ItemCardSubtitle>Author: {theme.author}</ItemCardSubtitle>
                            <ItemCardContent className="flex flex-col gap-y-4">
                                <div className="whitespace-pre-wrap">{theme.description}</div>
                                <Link href={theme.theme_uri} target="_blank">{theme.theme_uri}</Link>
                                <div className="flex flex-row flex-wrap gap-2">{theme.tags && theme.tags.split(',').map((tag: string) => (
                                    <Badge key={tag} variant="outline" className="text-sm text-muted-foreground">{tag}</Badge>
                                ))}
                                </div>
                            </ItemCardContent>
                        </ItemCard>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    <ItemCard className="mb-1">
                        <ItemCardTitle>WordPress Theme</ItemCardTitle>
                        <ItemCardSubtitle>Either this website does not use WordPress, or we were unable to determine the WordPress theme automatically.</ItemCardSubtitle>
                    </ItemCard>
                </div>
            )}
            {webHost && webHost.length > 0 ? (
                <div className="flex flex-col gap-6">
                    {webHost.map((host: WebHostRecord) => (
                        <ItemCard key={host.ip} className="mb-1">
                            <ItemCardTitle>DNS Record</ItemCardTitle>
                            <ItemCardSubtitle>{host.isp_name}</ItemCardSubtitle>
                            <ItemCardContent className="flex flex-col gap-y-2">
                                <div>IP: {host.ip}</div>
                                <div>Type: {host.type}</div>
                            </ItemCardContent>
                        </ItemCard>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    <ItemCard className="mb-1">
                        <ItemCardTitle>DNS Records</ItemCardTitle>
                        <ItemCardSubtitle>We were unable to determine the DNS records for this website.</ItemCardSubtitle>
                    </ItemCard>
                </div>
            )}
        </div>
    );
}