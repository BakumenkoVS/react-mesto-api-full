import React, { useState, useEffect } from "react";
import Header from "./Header";
import Main from "./Main";
import Footer from "./Footer";
import PopupWithForm from "./PopupWithForm";
import ImagePopup from "./ImagePopup";
import { api, authApi } from "../utils/Api.js";
import { CurrentUserContext } from "../contexts/CurrentUserContext";
import EditProfilePopup from "./EditProfilePopup";
import EditAvatarPopup from "./EditAvatarPopup";
import AddPlacePopup from "./AddPlacePopup";
import { ProtectedRoute } from "./ProtectedRoute";
import { Route, Routes, useNavigate } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";
import InfoTooltip from "./InfoTooltip";

function App() {
   //States
   const [isEditProfilePopupOpen, setIsEditProfilePopupOpen] = useState(false);
   const [isAddPlacePopupOpen, setIsAddPlacePopupOpen] = useState(false);
   const [isEditAvatarPopupOpen, setIsEditAvatarPopupOpen] = useState(false);
   const [selectedCard, setSelectedCard] = useState(null);
   const [currentUser, setCurrentUser] = useState(null);
   const [cards, setCards] = useState([]);
   const [loggedIn, setLoggedIn] = useState(false);
   const history = useNavigate();
   const [userInfo, setUserInfo] = useState(null);
   const [infoToolTip, setInfoToolTip] = useState({});
   const [infoToolTipOpen, setInfoToolTipOpen] = useState(false);

   useEffect(() => {
      tokenCheck();
   }, []);

   useEffect(() => {
      if (loggedIn) {
         history("/");
      }
   }, [loggedIn]);

   function handleRegister(password, email) {
      return authApi
         .signUp(password, email)
         .then((res) => {
            setInfoToolTipOpen(true);
            setInfoToolTip({
               text: "Вы успешно зарегистрировались!",
               class: "success",
            });
            history("/sign-in");
         })
         .catch((err) => {
            setInfoToolTip({
               text: "Что-то пошло не так! Попробуйте ещё раз.",
               class: "error",
            });
            setInfoToolTipOpen(true);
         });
   }

   function tokenCheck() {
      let jwt = localStorage.getItem("jwt");
      if (jwt) {
         authApi.getContent(jwt).then((res) => {
            if (res) {
               setUserInfo(res.data.email);

               setLoggedIn(true);
            }
         });
      }
   }

   function handleLogin(password, email) {
      return authApi
         .signIn(password, email)
         .then((data) => {
            if (data.token) {
               localStorage.setItem("jwt", data.token);
               setUserInfo(email);
               setLoggedIn(true);
               history("/");
            }
         })
         .catch(() => {
            setInfoToolTip({
               text: "Что-то пошло не так! Попробуйте ещё раз.",
               class: "error",
            });
            setInfoToolTipOpen(true);
         });
   }

   function signOut() {
      localStorage.removeItem("jwt");
      setLoggedIn(false);
   }

   //Card request and user information
   useEffect(() => {
      if (loggedIn) {
         Promise.all([api.getCard(), api.getUserInfo()])

            .then(([card, user]) => {
               setCurrentUser(user.data);
               setCards(card.slice().reverse());
            })
            .catch((err) => console.log(err));
      }
   }, [loggedIn]);

   //hendles
   function handleEditAvatarClick() {
      setIsEditAvatarPopupOpen(true);
   }

   function handleEditProfileClick() {
      setIsEditProfilePopupOpen(true);
   }

   function handleAddPlaceClick() {
      setIsAddPlacePopupOpen(true);
   }

   function handleCardClick(card) {
      setSelectedCard(card);
   }

   const closeAllPopups = () => {
      setIsEditAvatarPopupOpen(false);
      setIsAddPlacePopupOpen(false);
      setIsEditProfilePopupOpen(false);
      setSelectedCard(null);
      setInfoToolTipOpen(false);
   };

   const handleUpdateUser = (userInfo) => {
      debugger;
      api.addUserInfo(userInfo)
         .then((res) => {
            setCurrentUser((state) => {
               return { ...state, ...res };
            });
            setIsEditProfilePopupOpen(false);
            debugger;
         })
         .catch((err) => console.log(err));
   };

   const handleUpdateAvatar = (avatar) => {
      api.addAvatar(avatar)
         .then((res) => {
            setCurrentUser((state) => {
               return { ...state, ...res };
            });
            setIsEditAvatarPopupOpen(false);
         })
         .catch((err) => console.log(err));
   };

   const handleAddPlaceSubmit = (data) => {
      api.addCards(data)
         .then((res) => {
            setCards([res, ...cards]);
            setIsAddPlacePopupOpen(false);
         })
         .catch((err) => console.log(err));
   };

   function handleCardLike(card) {
      const isLiked = card.likes.some((i) => i === currentUser._id);

      api.changeLikeCardStatus(card._id, !isLiked)
         .then((newCard) => {
            setCards((state) =>
               state.map((c) => (c._id === card._id ? newCard : c)),
            );
         })
         .catch((err) => console.log(err));
   }

   function handleCardDelete(card) {
      api.deleteCard(card._id).then(() => {
         setCards((state) => state.filter((c) => c._id !== card._id)).catch(
            (err) => console.log(err),
         );
      });
   }

   return (
      <CurrentUserContext.Provider value={currentUser}>
         <div className="page">
            <Header signOut={signOut} userInfo={userInfo} />
            <Routes>
               <Route
                  path="/sign-in"
                  element={
                     <Login handleLogin={handleLogin} loggedIn={loggedIn} />
                  }
               />
               <Route
                  path="/sign-up"
                  element={
                     <Register
                        handleRegister={handleRegister}
                        loggedIn={loggedIn}
                     />
                  }
               />
               <Route
                  path="/"
                  element={
                     <ProtectedRoute>
                        <Main
                           onEditAvatar={handleEditAvatarClick}
                           onEditProfile={handleEditProfileClick}
                           onAddPlace={handleAddPlaceClick}
                           onCardClick={handleCardClick}
                           onCardLike={handleCardLike}
                           onCardDelete={handleCardDelete}
                           onCards={cards}
                           loggedIn={loggedIn}
                        />
                     </ProtectedRoute>
                  }
               />
            </Routes>

            <Footer />
            <EditProfilePopup
               isOpen={isEditProfilePopupOpen}
               onClose={closeAllPopups}
               onUpdateUser={handleUpdateUser}
            />

            <AddPlacePopup
               isOpen={isAddPlacePopupOpen}
               onClose={closeAllPopups}
               onAddPlace={handleAddPlaceSubmit}
            />

            <EditAvatarPopup
               isOpen={isEditAvatarPopupOpen}
               onClose={closeAllPopups}
               onUpdateAvatar={handleUpdateAvatar}
            />

            <PopupWithForm name="removal" title="Вы уверены?" />

            <ImagePopup onClose={closeAllPopups} card={selectedCard} />

            <InfoTooltip
               onClose={closeAllPopups}
               props={infoToolTip}
               isOpen={infoToolTipOpen}
            />
         </div>
      </CurrentUserContext.Provider>
   );
}

export default App;
