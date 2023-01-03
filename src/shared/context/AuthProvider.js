import { createContext, useEffect, useState } from "react";
import { Auth } from "aws-amplify";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState(null); 

    return (
        <AuthContext.Provider value={{ 
            auth, setAuth
            }}>
            {children}
        </AuthContext.Provider>
    )
}

export default AuthContext;