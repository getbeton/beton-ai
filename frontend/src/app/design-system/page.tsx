"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Checkbox } from "@/components/ui/checkbox"
import { Typography, H1, H2, H3, P, Lead, InlineCode, UL, OL, HR } from "@/components/ui/typography"
import { ChevronDown, Loader2, Plus, Settings, Upload } from "lucide-react"

export default function DesignSystemPage() {
  const [progress, setProgress] = React.useState(66)

  return (
    <div className="container py-8 space-y-10">
      <header className="space-y-2">
        <H1>Design System</H1>
        <Lead>Shadcn/ui components themed with our Tailwind tokens.</Lead>
      </header>

      <section className="space-y-6">
        <H2>Buttons</H2>
        <div className="flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
          <Button disabled>
            <Loader2 className="animate-spin" />
            Loading
          </Button>
        </div>
      </section>

      <Separator />

      <section className="space-y-6">
        <H2>Form Inputs</H2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@company.com" />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select one" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="agree" />
            <Label htmlFor="agree">I agree to the terms</Label>
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-6">
        <H2>Card, Tabs, Progress</H2>
        <Card>
          <CardHeader>
            <CardTitle>Upload Leads</CardTitle>
            <CardDescription>Import CSV and enrich with our integrations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="upload">
              <TabsList>
                <TabsTrigger value="upload">Upload</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
              <TabsContent value="upload" className="space-y-3">
                <Button>
                  <Upload />
                  Choose CSV
                </Button>
                <div className="space-y-2">
                  <Label htmlFor="campaign">Campaign Name</Label>
                  <Input id="campaign" placeholder="Q4 Enrichment" />
                </div>
              </TabsContent>
              <TabsContent value="history">
                <P>No uploads yet.</P>
              </TabsContent>
            </Tabs>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <Button variant="outline">
              <Settings />
              Configure
            </Button>
            <Button>
              <Plus />
              Start
            </Button>
          </CardFooter>
        </Card>
      </section>

      <Separator />

      <section className="space-y-6">
        <H2>Overlays</H2>
        <div className="flex flex-wrap gap-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button>Open Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dialog Title</DialogTitle>
                <DialogDescription>Short description of the dialog content.</DialogDescription>
              </DialogHeader>
              <P>Content goes here.</P>
            </DialogContent>
          </Dialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Actions
                <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuItem>Archive</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="secondary">Open Sheet</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Sheet Title</SheetTitle>
              </SheetHeader>
              <P>Sheet content goes here.</P>
            </SheetContent>
          </Sheet>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <H2>Typography</H2>
        <H3>Primitives</H3>
        <P>
          Use our <InlineCode>Typography</InlineCode> primitives for consistent spacing and contrast.
        </P>
        <UL>
          <li>Headings: H1, H2, H3, H4</li>
          <li>Body: P, Lead, Small, Muted</li>
          <li>Rich: Blockquote, InlineCode, Lists</li>
        </UL>
        <HR />
        <OL>
          <li>Map Figma tokens to our CSS variables.</li>
          <li>Use Tailwind utilities. Avoid custom CSS files.</li>
          <li>Prefer shadcn/ui components and lucide icons.</li>
        </OL>
      </section>
    </div>
  )
}


