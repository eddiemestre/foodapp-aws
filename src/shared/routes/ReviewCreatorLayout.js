import { Outlet } from "react-router-dom";
import { ReviewCreatorProvider } from "../context/ReviewCreatorContext";

const CreateReviewLayout = () => {
    return (
        <ReviewCreatorProvider >
            <Outlet />
        </ReviewCreatorProvider >
    );
}

export default CreateReviewLayout;
    