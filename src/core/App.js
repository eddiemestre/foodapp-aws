import './App.css';
import { Amplify } from 'aws-amplify';
import awsmobile from '../aws-exports';
import './App.css';
import React from "react"
import { Routes, Route } from 'react-router-dom';

// hooks
import { AuthProvider } from '../shared/context/AuthProvider';
import { DataProvider } from '../shared/context/DataContext';
import { ReviewProvider } from '../shared/context/SingleReviewContext';
import PersistLogin from '../shared/components/PersistLogin/PersistLogin';
import { RequireAuth } from '../shared/components/RequireAuth/RequireAuth';


import useWindowSize from '../hooks/useWindowSize';
import LargeScreenView from './LargeScreenView';

// templates
import PublicTemplate from '../shared/routes/PublicRouteTemplate';
import InAppTemplate from '../shared/routes/InAppTemplate';
import PersistReviewLayout from '../shared/routes/ReviewContextLayout';
import CreateReviewLayout from '../shared/routes/ReviewCreatorLayout';


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
                  <Route element={<InAppTemplate />}>
                      <>
                        <Route element={<CreateReviewLayout />}>
                          <Route path="/:username/feed" element={<Feed />} />
                          <Route element={<RequireAuth />}>
                            <Route path="/:username/create-review" element={<CreateReview />}/>
                          </Route>
                        </Route>
                        <Route element={<PersistReviewLayout />}>
                          <Route path="/:username/feed/:id" element={<SingleReview />} />
                          <Route element={<RequireAuth />}>
                            <Route path="/:username/feed/:id/edit" element={<EditReview />} />
                          </Route>
                        </Route>
                        <Route element={<RequireAuth />}>
                          <Route path="/:username/settings" element={<Settings />} />
                          <Route path="/:username/update-password" element={<UpdatePassword />} />
                          <Route path="/:username/update-email" element={<UpdateEmail />} />
                        </Route>
                      </>
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