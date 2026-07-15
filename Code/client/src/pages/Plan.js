import React from 'react';
import ValetudoMap from '../mapping/ValetudoMap';

import { useLocation } from 'react-router-dom';
function Plan() {

  const location = useLocation();
  const { selectedFiles } = location.state || {};

  return (
    <>
      <ValetudoMap />
    </>
  )
}

export default Plan