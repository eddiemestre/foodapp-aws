import { useEffect } from "react";
import { UnauthTests, AuthTests } from "./tests";
import useAuth from "../../../hooks/useAuth";

// runs backend tests from tests file
const BackendTests = () => {
    const { auth } = useAuth();

    useEffect(() => {
        async function ExecuteTests() {
            UnauthTests();

            if (auth?.identityId) {
                console.log("we have authed user")
                AuthTests(auth)
            }
        }

        ExecuteTests();
    }, [auth])
};

export default BackendTests;