import { useMarketplaceClient } from "./useMarketplaceClient";
import { useState, useEffect } from "react";
import { UserInfo } from "@sitecore-marketplace-sdk/client";

export interface UseUserReturn {
    user: UserInfo | undefined;
    isLoading: boolean;
}

export function useUser(): UseUserReturn {
    const { client, isInitialized } = useMarketplaceClient();
    const [user, setUser] = useState<UserInfo | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchUserData() {
            if (!client || !isInitialized) {
                return;
            }

            try {
                setIsLoading(true);
                const { data } = await client.query("host.user");
                setUser(data);
            } catch (error) {
                console.error("Failed to fetch user data:", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchUserData();
    }, [client, isInitialized]);

    return { user, isLoading };
}
