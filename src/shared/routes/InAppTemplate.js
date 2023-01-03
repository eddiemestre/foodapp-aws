import { Outlet } from "react-router-dom";
import InAppHeader from "../components/InAppHeader";
import { Container } from "./Styles";

const InAppTemplate = () => {

  return (
      <Container>
        <InAppHeader /> 
        <Outlet />
      </Container>
  )
    
}

  export default InAppTemplate;