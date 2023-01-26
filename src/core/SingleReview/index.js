import React, { useEffect, useState, useContext } from 'react';
import { GlobalStyle, 
    Container,  
    ContentContainer, 
    Title, 
    TitleContainer,
    Name, 
    Date, 
    Content, 
    LastEdited,
    ButtonPosition,
    BackContainer,
    OuterContainer,
    ButtonContainer } from './Styles';
import { useParams, Link, useNavigate } from 'react-router-dom';
import DataContext from '../../shared/context/DataContext';
import SingleReviewContext from '../../shared/context/SingleReviewContext';
import useAuth from '../../hooks/useAuth';
import { useTransition } from '@react-spring/web';
import NotFound from '../../shared/components/NotFound';


const SingleReviewView = () => {
    const { auth } = useAuth();
    const params = useParams();
    const navigate = useNavigate();
    const { currentReview, currentPageUser } = useContext(DataContext)
    const { notFound, isLoading } = useContext(SingleReviewContext)
    const fromReviewFeed = useState(true)
    const [isAuthedUser, setIsAuthedUser] = useState(false) // for edit & back button
    const [rerender, setRerender] = useState(false);
    const [isLoading2, setIsLoading2] = useState(true)

    useEffect(() => {
        setRerender(!rerender)  // dummy state
        setIsLoading2(false)
    }, [currentReview])


    useEffect(() => {
        // console.log("update params")
        // setNotFound(false)
        if (auth?.username === params?.username) {
            setIsAuthedUser(true)
        }
        // setIsLoading(true)
    }, [])

    const EditButton = () => {
        return (
            <ButtonPosition
              xmlns="http://www.w3.org/2000/svg"
              width="60"
              height="60"
              fill="none"
              viewBox="0 0 60 60"
            >
              <circle cx="30" cy="30" r="30" fill="#03DAC6"></circle>
              <path
                fill="#000"
                d="M23.333 37.905a.826.826 0 00.2 0l3.334-.833a.834.834 0 00.391-.217L37.5 26.58a1.666 1.666 0 000-2.35l-1.317-1.325a1.666 1.666 0 00-2.358 0L23.583 33.147a.883.883 0 00-.225.392l-.833 3.333a.835.835 0 00.608 1.033.826.826 0 00.2 0z"
              ></path>
              <path
                fill="#03DAC6"
                d="M35 24.08l1.325 1.325L35 26.73l-1.317-1.325L35 24.08zM24.925 34.164L32.5 26.58l1.325 1.325-7.583 7.584-1.759.433.442-1.758z"
              ></path>
            </ButtonPosition>
        );
    }

    const BackButton = () => {
        return (
            <ButtonPosition
            xmlns="http://www.w3.org/2000/svg"
            width="60"
            height="60"
            fill="none"
            viewBox="0 0 60 60"
          >
            <circle cx="30" cy="30" r="30" fill="#121212"></circle>
            <circle cx="30" cy="30" r="30" fill="#fff" fillOpacity="0.08"></circle>
            <path
              fill="#fff"
              d="M35.383 21.325l-1.917-1.918L22.74 30.132l10.725 10.725 1.917-1.917-8.807-8.808 8.807-8.807z"
            ></path>
          </ButtonPosition>
        );
    }

      const EditAppear = useTransition(isAuthedUser, {
        from: { opacity: 0, transform: "translateY(20px)" },
        enter: { opacity: 1, transform: "translateY(0px)" },
        leave: { opacity: 0, transform: "translateY(20px)" },
        reverse: isAuthedUser,
        delay: 300,
        // onRest: () => PauseAnimation(),
    });

    const BackAppear = useTransition(fromReviewFeed, {
        from: { opacity: 0, transform: "translateY(20px)" },
        enter: { opacity: 1, transform: "translateY(0px)" },
        leave: { opacity: 0, transform: "translateY(20px)" },
        // reverse: isAuthedUser,
        delay: 400,
    });

    const handleEditClick = () => {
        navigate(`/${auth?.username}/feed/${params.id}/edit`)
    }

    const handleBackClick = () => {
        // navigate(`/user/${params.username}/`)
        navigate(`/${params.username}/feed`)
    }

    return (
            <>
                <GlobalStyle />
                {!isLoading && !isLoading2 && !notFound &&
                    <>
                        <OuterContainer>
                        <Container>
                            <TitleContainer>
                            <Title>{currentReview?.title}</Title>
                            </TitleContainer>
                            <ContentContainer>
                                <Link to={`/${currentPageUser?.username}/feed`} style={{textDecoration: 'none'}}><Name>{currentPageUser?.name}</Name></Link>
                                <Date>{currentReview?.date_formatted}</Date>
                                <Content>{currentReview?.content}</Content>
                                <LastEdited>Last edited on {currentReview?.updatedAt_formatted}</LastEdited>
                            </ContentContainer>
                        </Container>
                        </OuterContainer>

                        {/* show button for editing if isAuthedUser is true */}
                        {isAuthedUser && 
                            EditAppear((style, item) =>
                                item ? 
                                <ButtonContainer style={style} onClick={() => handleEditClick()}>{EditButton()}</ButtonContainer>
                                : ''
                                )
                        }
                        {/* show button for going back if fromListView is true */}
                        {fromReviewFeed && 
                            BackAppear((style, item) =>
                                item ? 
                                <BackContainer style={style} onClick={() => handleBackClick()}>{BackButton()}</BackContainer>
                                : ''
                                )
                        }
                    </>
                }
                {!isLoading && !isLoading2 && notFound && 
                    <NotFound />
                }
            </>
    );
}

export default SingleReviewView;