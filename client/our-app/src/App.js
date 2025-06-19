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
function App() {
  return (
    <Router>
      <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/profile/:userId" element={<Profile />} /> {/* נתיב חדש לפרופיל */}
        <Route path="/signup" element={<SignUp />} />
        <Route path="/usersearch" element={<UserSearch />} />
        <Route path="/edit-profile/:userId" element={<EditProfile />} />
        <Route path="/create-group/:userId" element={<CreateGroup />} />
        <Route path="/group/:groupId" element={<GroupPage />} />
        
      </Routes>
      </Layout>
    </Router>
  );
}

export default App;