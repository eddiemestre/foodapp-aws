import React, { useEffect } from "react";
import { UnauthTests, AuthTests } from "../../utils/tests";
import useAuth from "../../../hooks/useAuth";

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