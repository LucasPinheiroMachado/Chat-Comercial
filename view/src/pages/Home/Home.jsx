import React from 'react'
import MenuHome from '../../components/MenuHome/MenuHome'
import SearchMenu from '../../components/SearchMenu/SearchMenu'

const Home = () => {
  return (
    <div className='home'>
        <SearchMenu/>
        <MenuHome/>
    </div>
  )
}

export default Home