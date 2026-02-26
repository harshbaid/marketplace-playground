import { useUser } from "@/src/utils/hooks/useUser";
import { UserInfo } from "@sitecore-marketplace-sdk/client";

// Extended type to access fields not included in SDK's UserInfo type
interface ExtendedUserInfo extends UserInfo {
    given_name?: string;
    family_name?: string;
}

export function WhoAmI() {
    const { user, isLoading } = useUser();
    const extendedUser = user as ExtendedUserInfo | undefined;
    const currentUsername = extendedUser?.name ?? "";
    const given_name = extendedUser?.given_name ?? "";
    const displayName = given_name || currentUsername || "Sara";

    if (isLoading) {
        return (
            <div>
                Loading...
            </div>
        );
    }

    return (
        <div>
            Hello {displayName}
        </div>
    );
}
