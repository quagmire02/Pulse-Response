'use client'

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getPaymentsAction } from "@/actions/paymentActions" 
import PaymentCard from "@/components/cards/PaymentCard" 
import Link from "next/link" 
import Pagination from "@/components/paginations/Pagination"
import styles from "./page.module.css" 

export default function PaymentsPage() { 
  const router = useRouter()
  const searchParams = useSearchParams()

  const [payments, setPayments] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [filters, setFilters] = useState({
    page: searchParams.get("page") || "1",
  })

  useEffect(() => {
    const loadPayments = async () => {
      setLoading(true)
      setError(null)
      console.log(filters)
      const result = await getPaymentsAction(filters)
      
      if (result.error) {
        setError(result.error)
      } else {
        setPayments(result.data || [])
        setPagination(result.pagination)
      }

      setLoading(false)
    }

    loadPayments()
  }, [filters])

  const handlePageChange = (page) => {
    const updatedFilters = { ...filters, page: page.toString() }
    setFilters(updatedFilters)

    const queryParams = new URLSearchParams(updatedFilters)
    router.push(`/payment?${queryParams.toString()}`)
  }

  return ( 
    <div className={styles.container}> 
      <div className={styles.header}> 
        <h1>Payment History</h1> 
        <Link href="/" className={styles.backLink}> 
          Back to Home 
        </Link> 
      </div> 
      {/* Cash orders settle when the rider hands the goods over, so there is
          nothing for the customer to confirm here. */}
      <p className={styles.cashNotice}>
        Cash orders are marked paid automatically once the delivery is completed.
        You will get a notification the moment the payment is recorded.
      </p>

      {loading ? (
        <div className={styles.loading}>Loading payments...</div>
      ) : error ? (
        <div className={styles.error}>Error loading payments: {error}</div>
      ) : (
        <>
          <div className={styles.paymentsGrid}> 
            {payments.length > 0 ? (
              payments.map((payment) => ( 
                <PaymentCard key={payment.id} payment={payment} /> 
              ))
            ) : (
              <div className={styles.noResults}>
                <h3>No payments found</h3>
                <p>You haven't made any payments yet.</p>
              </div>
            )}
          </div>
          {pagination && pagination.total_pages > 1 && (
            <Pagination
              currentPage={Number.parseInt(filters.page)}
              totalPages={pagination.total_pages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div> 
  ) 
}