import { useState } from "react";
import { Container, Typography } from "@mui/material";
import UserForm from "../components/UserForm";
import UserList from "../components/UserList";

const Home = () => {
  const [refresh, setRefresh] = useState(false);

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" align="center" gutterBottom>
        Mini Web App
      </Typography>
      <UserForm onUserAdded={() => setRefresh((r) => !r)} />
      <UserList key={refresh} />
    </Container>
  );
};

export default Home;
