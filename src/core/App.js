// import logo from './logo.svg';
import './App.css';
import { createBlog, updateBlog, createComment, deleteComment} from '../graphql/mutations'
import { listComments, listBlogs } from '../graphql/queries'
import { Amplify, API, graphqlOperation } from 'aws-amplify';
import awsmobile from '../aws-exports';
import './App.css';
import React, { useContext, useEffect } from "react"
import { Routes, Route } from 'react-router-dom';

// hooks
// import { RegistrationProvider } from '../../context/RegistrationContext';
// import { AuthProvider } from '../../context/AuthProvider';
// import { DataProvider } from '../../context/DataContext';
import { AuthProvider } from '../shared/context/AuthProvider';
import { DataProvider } from '../shared/context/DataContext';
import { ReviewProvider } from '../shared/context/SingleReviewContext';
import PersistLogin from '../shared/components/PersistLogin/PersistLogin';
import { RequireAuth, RequireAuthSettings } from '../shared/components/RequireAuth/RequireAuth';
// import PersistLogin from '../PersistLogin/PersistLogin';
// import { RequireAuthCreate, RequireAuthEdit, RequireAuthSettings } from '../RequireAuth';

import useWindowSize from '../hooks/useWindowSize';
import LargeScreenView from './LargeScreenView';

// templates
// import PublicTemplate from '../Routes/PublicRouteTemplate';
import PublicTemplate from '../shared/routes/PublicRouteTemplate';
import ReviewAdderTemplate from '../shared/routes/PersistentReviewAdder';
import InAppTemplate from '../shared/routes/InAppTemplate';
import PersistReviewLayout from '../shared/routes/ReviewContextLayout';
import CreateReviewLayout from '../shared/routes/ReviewCreatorLayout';
// import InAppTemplate from '../Routes/InAppTemplate';
// import ReviewAdderTemplate from '../Routes/PersistentReviewAdder';

// pages
import Home from './Home';
import Feed from './Feed';
import SingleReview from './SingleReview';
import CreateReview from './CreateReview';
import EditReview from './EditReview'
import Settings from './Settings';
import UpdatePassword from './UpdatePassword';
import UpdateEmail from './UpdateEmail';

import Login from './Login';
import SignUp from './SignUp';

// for testing
import BackendTests from '../shared/components/BackendTests';

// import Login from '../../pages/Login/Login';
// import SignUp from '../../pages/SignUp/SignUp';
// import Feed from '../../pages/Feed';
// import SingleReviewView from '../../pages/SingleReviewView';
// import CreateReview from '../../pages/CreateReview';
// import EditReview from '../../pages/EditReview';
// import Settings from '../../pages/Settings';
// import UpdatePassword from '../../pages/UpdatePassword';
// import NotFound from '../../pages/NotFound';
Amplify.configure(awsmobile);


function App() {
  const { width } = useWindowSize();

  return (
    <AuthProvider>
      <DataProvider>
        {/* for testing */}
        {/* <BackendTests/>  */}
        { width < 600 || width == undefined ?
          <>
            <Routes>
              <Route element={<PublicTemplate />}>
                <Route path="/" element={<Home />} />
                  <Route exact path="/signup" element={<SignUp />} />
                  <Route exact path="/login" element={<Login />} />
                </Route>
              <Route element={<PersistLogin />}>
                <Route element={<RequireAuth />}>
                  <Route element={<InAppTemplate />}>
                      <>
                        <Route element={<CreateReviewLayout />}>
                          <Route path="/:username/feed" element={<Feed />} />
                          <Route path="/:username/create-review" element={<CreateReview />}/>
                        </Route>
                        <Route element={<PersistReviewLayout />}>
                          <Route path="/:username/feed/:id" element={<SingleReview />} />
                          <Route path="/:username/feed/:id/edit" element={<EditReview />} />
                        </Route>
                        <Route path="/:username/settings" element={<Settings />} />
                        <Route path="/:username/update-password" element={<UpdatePassword />} />
                        <Route path="/:username/update-email" element={<UpdateEmail />} />
                      </>
                  </Route>
                </Route>
              </Route>
            </Routes>
          </>
        : <LargeScreenView />}
      </DataProvider>
    </AuthProvider>
  );
}

export default App;