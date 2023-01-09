import { useLocation, Navigate, Outlet } from "react-router-dom";
import useAuth from "../../../hooks/useAuth";


export const RequireAuth = () => {
    const { auth } = useAuth();
    const location = useLocation();

    return (
        auth?.name
        ? <Outlet />
        : <Navigate to="/login" state={{ from: location }} replace />
    );
}

// export const RequireAuthCreate = () => {
//     const { toggleReviewOff,
//             setReviewModuleActive,
//             setInputHasChanged,
//             inputHasChanged } = useOutletContext();
//     const { auth } = useAuth();
//     const location = useLocation();

//     return (
//         auth?.name
//         ? <Outlet context={{ 
//             toggleReviewOff,
//             setReviewModuleActive,
//             setInputHasChanged,
//             inputHasChanged }}
//         />
//         : <Navigate to="/login" state={{ from: location }} replace />
//     );
// }

