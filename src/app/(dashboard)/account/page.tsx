"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { LockKeyhole, ShieldAlert, Trash2, UserRound } from "lucide-react"
import { toast } from "sonner"

import { ChangePasswordForm } from "@/components/change-password-form"
import { ProfileSettings } from "@/components/profile-settings"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useDeleteAccount } from "@/hooks/api/use-auth"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuthRole } from "@/hooks/use-auth-role"

const accountSections = [
  { value: "profile", title: "Personal Information", icon: UserRound },
  { value: "password", title: "Change Password", icon: LockKeyhole },
] as const

import { RoleGuard } from "@/components/role-guard"

export default function AccountPage() {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get("tab") === "password" ? "password" : "profile"
  const deleteAccount = useDeleteAccount()
  const { role } = useAuthRole()
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = React.useState("")
  const isDeleteAccountAllowed = role !== "admin" && role !== "clinic_admin"

  function handleDeleteAccount() {
    if (deleteConfirmation.trim() !== "DELETE") {
      toast.error('Type "DELETE" to confirm account removal')
      return
    }

    deleteAccount.mutate(
      { confirmation: "DELETE" },
      {
        onSuccess: () => {
          setDeleteConfirmation("")
          setDeleteDialogOpen(false)
        },
      }
    )
  }

  return (
    <RoleGuard>
      <div className="space-y-6 px-4 pb-8 lg:px-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground">
            Manage your profile and update your password from one place.
          </p>
          {isDeleteAccountAllowed && (
            <Dialog
              open={deleteDialogOpen}
              onOpenChange={(open) => {
                setDeleteDialogOpen(open)
                if (!open) {
                  setDeleteConfirmation("")
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="cursor-pointer border-red-200 bg-red-50 text-red-600 hover:border-red-300 hover:bg-red-100 hover:text-red-700 dark:border-red-950 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  Delete Account
                  <Trash2 className="size-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete your account?</DialogTitle>
                  <DialogDescription>
                    This will delete your account. Type <span className="font-semibold">DELETE</span> to
                    confirm that you want to remove access for this account.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-950 dark:bg-red-950/20">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-red-100 p-2 text-red-600 dark:bg-red-950/70 dark:text-red-400">
                      <ShieldAlert className="size-4" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                        Account Delete
                      </p>
                      <p className="text-sm text-red-700/80 dark:text-red-300/80">
                        Your account will be deleted and access will be removed after confirmation.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="delete-confirmation">Confirmation</Label>
                    <Input
                      id="delete-confirmation"
                      value={deleteConfirmation}
                      onChange={(event) => setDeleteConfirmation(event.target.value)}
                      placeholder='Type "DELETE" to continue'
                      disabled={deleteAccount.isPending}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    type="button"
                    className="cursor-pointer"
                    disabled={deleteAccount.isPending}
                    onClick={() => setDeleteDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    type="button"
                    className="cursor-pointer"
                    disabled={deleteAccount.isPending}
                    onClick={handleDeleteAccount}
                  >
                    {deleteAccount.isPending ? "Deleting..." : "Confirm Delete"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Tabs defaultValue={initialTab} className="min-w-0 w-full max-w-full gap-3">
        <TabsList className="grid h-auto w-full md:w-max max-w-full min-w-0 grid-cols-2 gap-2 rounded-lg bg-muted/50 p-1 md:flex md:h-12 md:min-h-12 md:justify-start md:overflow-x-auto md:p-1 md:[scrollbar-width:thin]">
          {accountSections.map((section) => {
            const Icon = section.icon

            return (
              <TabsTrigger
                key={section.value}
                value={section.value}
                className="h-auto min-h-10 w-full justify-center  text-center text-sm leading-tight md:h-10 md:min-h-0 md:w-auto md:shrink-0"
              >
                <Icon className="size-3.5 shrink-0" />
                <span>{section.title}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value="profile" className="mt-0">
          <Card className="border-border/60 shadow-xs">
            <CardHeader className="space-y-2 pb-4">
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update the personal details shown across your account and profile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password" className="mt-0">
          <Card className="border-border/60 shadow-xs">
            <CardHeader className="space-y-2 pb-4">
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password without mixing it into profile-editing actions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChangePasswordForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </RoleGuard>
  )
}
