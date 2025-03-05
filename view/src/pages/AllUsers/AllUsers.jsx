import React from 'react'
import AllUsersComponent from '../../components/AllUsers/AllUsersComponent'
import SearchMenu from '../../components/SearchMenu/SearchMenu'

const AllUsers = () => {
  return (
    <div>
      <SearchMenu/>
      <AllUsersComponent/>
    </div>
  )
}

export default AllUsers