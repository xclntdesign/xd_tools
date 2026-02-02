import { ItemCard, ItemCardContent, ItemCardSubtitle, ItemCardTitle } from "@/components/item-card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { capitalizeFirstLetter } from "../utils";
import { Meta, Tech, WPTheme, WebHostRecord } from "./web-audit";

export function SiteInfoSection ({ tech, meta, wpTheme, webHost }: { tech: Tech[] | null, meta: Meta | null, wpTheme: WPTheme[] | null, webHost: WebHostRecord[] | null }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 my-6">
            {tech && (
                <div className="flex flex-col gap-6">
                    {tech?.length > 0 && tech?.map((tech: Tech) => (
                        <ItemCard key={tech.id} className="mb-1">
                            <ItemCardTitle>{tech.categories.join(', ')}</ItemCardTitle>
                            <ItemCardSubtitle>{tech.name}</ItemCardSubtitle>
                            <ItemCardContent>
                                Version: {tech.version !== "" ? tech.version : "Unknown"}
                            </ItemCardContent>
                        </ItemCard>
                    ))}
                </div>
            )}
            {meta && (
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
            )}
            {wpTheme && (
                <div className="flex flex-col gap-6">
                    {wpTheme.length > 0 && wpTheme.map((theme: WPTheme) => (
                        <ItemCard key={theme.theme_uri} className="mb-1">
                            <ItemCardTitle>{theme.theme_name}</ItemCardTitle>
                            <ItemCardSubtitle>Author: {theme.author}</ItemCardSubtitle>
                            <ItemCardContent className="flex flex-col gap-y-4">
                                <div className="whitespace-pre-wrap">{theme.description}</div>
                                <Link href={theme.theme_uri} target="_blank">{theme.theme_uri}</Link>
                                <div className="flex flex-row flex-wrap gap-2">{theme.tags.split(',').map((tag: string) => (
                                    <Badge key={tag} variant="outline" className="text-sm text-muted-foreground">{tag}</Badge>
                                ))}
                                </div>
                            </ItemCardContent>
                        </ItemCard>
                    ))}
                </div>
            )}
            {webHost && (
                <div className="flex flex-col gap-6">
                    {webHost.length > 0 && webHost.map((host: WebHostRecord) => (
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
            )}
        </div>
    );
}