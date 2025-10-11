terraform {
  backend "s3" {
    bucket         = "farmermarket-tfstate"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "farmermarket-tfstate-lock"
    encrypt        = true
  }
}

