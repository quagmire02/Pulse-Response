"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import ProfileForm from "@/components/forms/ProfileForm"
import { getUserAction } from "@/actions/userActions"

export default function ProfilePage() {
  const params = useParams()
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const result = await getUserAction(params.id)
        if (result.error) {
          setError(result.error)
        } else {
          setUserData(result.data)
        }
      } catch (err) {
        setError("Failed to load user data")
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchUser()
    }
  }, [params.id])

  const handleUserUpdate = async () => {
    // Refetch user data after update
    const result = await getUserAction(params.id)
    if (result.data) {
      setUserData(result.data)
    }
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  if (error) {
    return <div className="error">Error: {error}</div>
  }

  return (
    <div className="profile-page">
      <h1>User Profile</h1>
      {userData && <ProfileForm userData={userData} userId={params.id} onUserUpdate={handleUserUpdate} />}
    </div>
  )
}

