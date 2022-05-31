import React, { createContext, useState, useRef, useEffect } from 'react';
import Peer from 'simple-peer';
import { addDoc, doc, collection, updateDoc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from './firebase.js';

const SocketContext = createContext();

const ContextProvider = ({ children }) => {
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [stream, setStream] = useState();
  const [name, setName] = useState('');
  const [call, setCall] = useState({});
  const [me, setMe] = useState('');

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();
  const notifsCollectionRef = collection(db, 'notifs');

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);

        myVideo.current.srcObject = currentStream;
      });
    (async () => {
      const mes = await addDoc(notifsCollectionRef, { name: 'sss' });
      setMe(mes.id);
    })();
    const unsub = onSnapshot(query(collection(db, 'notifs'), where('name', '==', 'sss')), (querySnapshot) => {
      querySnapshot.docChanges().forEach((a) => {
        if (a.type !== 'modified') return;
        if (a.doc.data().signalDataOpponent) return;
        setCall({ isReceivingCall: true, id: a.doc.id, ...a.doc.data() });
      });
    });
    return unsub;
  }, []);

  const answerCall = () => {
    setCallAccepted(true);

    const peer = new Peer({ initiator: false, trickle: false, stream });

    peer.on('signal', (data) => {
      const callingRef = doc(db, 'notifs', call.id);
      updateDoc(callingRef, { signalDataOpponent: data });
    });

    peer.on('stream', (currentStream) => {
      userVideo.current.srcObject = currentStream;
    });

    peer.signal(call.signalData);

    connectionRef.current = peer;
  };

  const callUser = (id) => {
    const peer = new Peer({ initiator: true, trickle: false, stream });
    const ref = doc(db, 'notifs', id);
    peer.on('signal', async (data) => {
      await updateDoc(ref, { userToCall: id, signalData: data, from: me, signalDataOpponent: null });
    });

    peer.on('stream', (currentStream) => {
      userVideo.current.srcObject = currentStream;
    });
    connectionRef.current = peer;
    // Send data to firebase
    return new Promise((resolve) => {
      const unsub = onSnapshot(doc(db, 'notifs', id), (snapshot) => {
        if (!snapshot.data().signalDataOpponent) { return; }// IDトークンのリフレッシュ
        setCallAccepted(true);
        peer.signal(snapshot.data().signalDataOpponent);
        unsub();
        resolve();
      });
    });
  };

  const leaveCall = () => {
    setCallEnded(true);

    connectionRef.current.destroy();

    window.location.reload();
  };

  return (
    <SocketContext.Provider value={{
      call,
      callAccepted,
      myVideo,
      userVideo,
      stream,
      name,
      setName,
      callEnded,
      me,
      callUser,
      leaveCall,
      answerCall,
    }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export { ContextProvider, SocketContext };
