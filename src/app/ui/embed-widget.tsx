'use client'

import { useEffect } from "react"
import type { WidgetLabels } from "@/care-desk/config/labels"
import CareDeskWidget from "@/care-desk/web/widget/CareDeskWidget"
import { openCareDeskWidget } from "@/care-desk/web/widget/open"

export default function EmbedWidget({labels}: { labels: WidgetLabels}) {
    useEffect(() => {
        function onMessage( event: MessageEvent ) {
            if (event.source !== window.parent) return;
            const data = event.data as { source?: unknown; action?: unknown } | null;
            if (data?.source === 'care-desk-host' && data.action === 'open') openCareDeskWidget();
        }
        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, []);
    return (
        <CareDeskWidget
            labels={labels}
            embedded
            onOpenChange={(open) => window.parent.postMessage({ source: 'care-desk', open }, '*')}
            />
    )
}