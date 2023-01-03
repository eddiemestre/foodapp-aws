import { Outlet } from "react-router-dom";
import { ReviewProvider } from "../context/SingleReviewContext";

const PersistReviewLayout = () => {
    return (
        <ReviewProvider >
            <Outlet />
        </ReviewProvider >
    );
}

export default PersistReviewLayout;
    