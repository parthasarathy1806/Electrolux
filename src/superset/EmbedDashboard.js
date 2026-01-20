import { useEffect, useState } from "react";
import { embedDashboard } from "@superset-ui/embedded-sdk";
import { getSupersetGuestToken } from "../api/SupersetAuth";
import { supersetUrl } from "../config/index";

export default function EmbedDashboard({ dashboardId, classname = "container-fixed" }) {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isActive = true;

        async function embedSuperset() {
            const guestToken = await getSupersetGuestToken(dashboardId);
            if (!isActive || !guestToken) return;

            const container = document.getElementById(`superset-container-${dashboardId}`);
            if (!container) return;

            embedDashboard({
                id: dashboardId,
                supersetDomain: `${supersetUrl}`,
                mountPoint: container,
                fetchGuestToken: () => Promise.resolve(guestToken),
                dashboardUiConfig: {
                    hideTitle: true,
                    filters: { expanded: false },
                },
            });

            setLoading(false);
        }

        embedSuperset();
        return () => {
            isActive = false;
        };
    }, [dashboardId]);

    return (
        <div className={classname}>
            {loading && <p style={{ textAlign: "center" }}>Loading dashboard...</p>}
            <div
                id={`superset-container-${dashboardId}`}
            ></div>
        </div>
    );
}
