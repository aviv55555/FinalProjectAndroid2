import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from './Components/Dashboard';
import Feed from './Components/Feed';
import Profile from './Components/Profile';
import SignUp from './Components/SignUp'
import UserSearch from "./Components/UserSearch";
import Layout from "./Components/Layout";
import EditProfile from "./Components/EditProfile";
import CreateGroup from "./Components/CreateGroup";
import GroupPage from './Components/GroupPage';
import Groups from './Components/Groups';
import ChatWrapper  from "./Components/ChatWrapper";
import AutoLogout from "./Components/AutoLogout";
import TourMap from "./Components/TourMap";
import Statistics from './Components/Statistics';
import SignIn from "./Components/SignIn";
import WelcomePage from "./Components/WelcomePage";
import ChatList from "./Components/ChatList";
function App() {
  return (
    <Router>
      <Layout>
        <AutoLogout />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/profile/:userId" element={<Profile />} /> 
        <Route path="/signup" element={<SignUp />} />
        <Route path="/usersearch" element={<UserSearch />} />
        <Route path="/edit-profile/:userId" element={<EditProfile />} />
        <Route path="/create-group/:userId" element={<CreateGroup />} />
        <Route path="/group/:groupId" element={<GroupPage />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/chat/:otherUserId"  element={<ChatWrapper />} />
        <Route path="/chatlist" element={<ChatList />} />
        <Route path="/map" element={<TourMap />} />
        <Route path="/statistics" element={<Statistics />} />
      </Routes>
      </Layout>
    </Router>
  );
}

export default App;